package chaincode

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const MaxValueForLoan = 1.7e+308

// SmartContract provides functions for managing an Asset
type SmartContract struct {
	contractapi.Contract
}

type Loan struct {
	Id           string
	BankId       string
	Type         string
	Liability    string
	Amount       float64
	Duration     int
	InterestRate float64
}

type Document struct {
	AnnualRevenue          float64
	CreditHistory          []string
	CreditUtilization      float64
	DebtToEquityRatio      float64
	DefaultHistory         string
	IndustryRisk           float64
	Liquidity              float64
	Location               string
	MarketConditions       float64
	NetProfitMargin        float64
	PaymentHistory         float64
	Profitability          float64
	RecentCreditInquiries  float64
	Solvency               float64
	TypesOfCreditUsed      string
	YearsInBusiness        float64
	CreditScoreCalibration float64
}
type Bank struct {
	BankId       string
	BankName     string
	TotalValue   float64
	InterestRate float64
}

type SME struct {
	Name        string
	GstinNo     string
	Eligibility bool
	EligibleAmt float64
	Loans       []Loan
	Docs        Document
	CreditScore float64
}

func findEligibleAmt() (bool, float64) {
	// ML Algorithm implementation api call
	return true, 1000.98
}

func (s *SmartContract) EnrollBanks(ctx contractapi.TransactionContextInterface) error {
	if msp, err := ctx.GetClientIdentity().GetMSPID(); msp != "PlatformMSP" && err != nil {
		return errors.New("this operation can only be done by Platform")
	}

	banks := []Bank{
		{BankId: "bank1", BankName: "HDFC", TotalValue: MaxValueForLoan, InterestRate: 5.0},
		{BankId: "bank2", BankName: "SBI", TotalValue: MaxValueForLoan, InterestRate: 4.0},
		{BankId: "bank3", BankName: "AXIS", TotalValue: MaxValueForLoan, InterestRate: 3.0},
	}

	for _, bank := range banks {
		assetJSON, err := json.Marshal(bank)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(bank.BankId, assetJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state. %v", err)
		}
	}

	return nil
}

func (s *SmartContract) ReadBank(ctx contractapi.TransactionContextInterface, bankId string) (*Bank, error) {

	smeJSON, err := ctx.GetStub().GetState(bankId)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if smeJSON == nil {
		return nil, fmt.Errorf("the asset %s does not exist", bankId)
	}

	var bank Bank
	err = json.Unmarshal(smeJSON, &bank)
	if err != nil {
		return nil, err
	}

	return &bank, nil
}

func (s *SmartContract) SMEExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

func (s *SmartContract) EnrollSME(ctx contractapi.TransactionContextInterface, name string, gstinNo string) error {
	if msp, err := ctx.GetClientIdentity().GetMSPID(); msp != "PlatformMSP" && err != nil {
		return errors.New("this operation can only be done by Platform")
	}
	exists, err := s.SMEExists(ctx, gstinNo)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the asset %s already exists", gstinNo)
	}
	loans := []Loan{}
	cr := []string{}
	eligiblity, eligibleAmt := findEligibleAmt()
	sme := SME{
		Name:        name,
		GstinNo:     gstinNo,
		Eligibility: eligiblity,
		EligibleAmt: eligibleAmt,
		Loans:       loans,
	}
	sme.Docs.CreditHistory = cr
	smeJSON, err := json.Marshal(sme)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(gstinNo, smeJSON)
}

func (s *SmartContract) ReadSME(ctx contractapi.TransactionContextInterface, gstinNo string) (*SME, error) {

	smeJSON, err := ctx.GetStub().GetState(gstinNo)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if smeJSON == nil {
		return nil, fmt.Errorf("the asset %s does not exist", gstinNo)
	}

	var sme SME
	err = json.Unmarshal(smeJSON, &sme)
	if err != nil {
		return nil, err
	}

	return &sme, nil
}

func (s *SmartContract) NewLoan(id string, itype string, liability string, amount float64, duration int, interestRate float64, bankId string) Loan {
	return Loan{
		Id:           id,
		Type:         itype,
		Liability:    liability,
		Amount:       amount,
		Duration:     duration,
		InterestRate: interestRate,
		BankId:       bankId,
	}
}

func (s *SmartContract) Issueloan(ctx contractapi.TransactionContextInterface, gstinNo string, id string,
	itype string, liability string, amount float64, duration int, bankId string) error {

	loan := s.NewLoan(id, itype, liability, amount, duration, 3.0, bankId)
	bank, err := s.ReadBank(ctx, bankId)
	if err != nil {
		return errors.New("bank does not exist")
	}
	sme, _ := s.ReadSME(ctx, gstinNo)
	if sme.EligibleAmt < loan.Amount {
		return errors.New("Loan amount invalid")
	}
	bank.TotalValue -= loan.Amount

	marshalBank, err := json.Marshal(bank)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(bank.BankId, marshalBank)
	if err != nil {
		return errors.New("unable to update bank balance")
	}
	sme.Loans = append(sme.Loans, loan)
	assetJSON, err := json.Marshal(sme)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(sme.GstinNo, assetJSON)
}

func loanExists(loans []Loan, loanId string) int {
	for idx, val := range loans {
		if loanId == val.Id {
			return idx
		}
	}
	return -1
}

func remove(loans []Loan, loanId string) []Loan {
	for idx, val := range loans {
		if loanId == val.Id {
			return append(loans[:idx], loans[idx+1:]...)
		}
	}
	return nil
}

func (s *SmartContract) RepayLoan(ctx contractapi.TransactionContextInterface, gstinNo string, loanId string) error {

	// loan := s.NewLoan(id, itype, liability, amount, duration, 3.0)
	sme, err := s.ReadSME(ctx, gstinNo)
	if err != nil {
		return errors.New("SME doesn't exist")
	}

	idx := loanExists(sme.Loans, loanId)

	if idx == -1 {
		return errors.New("loan does not exist")
	}
	bank, _ := s.ReadBank(ctx, sme.Loans[idx].BankId)
	bank.TotalValue += sme.Loans[idx].Amount

	marshalBank, err := json.Marshal(bank)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(bank.BankId, marshalBank)
	if err != nil {
		return err
	}

	sme.Loans = remove(sme.Loans, loanId)
	assetJSON, err := json.Marshal(sme)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(sme.GstinNo, assetJSON)
}

// DeleteAsset deletes an given asset from the world state. here asset can be bank or sme
func (s *SmartContract) DeleteAsset(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("the asset %s does not exist", id)
	}

	return ctx.GetStub().DelState(id)
}

// AssetExists returns true when asset with given ID exists in world state. here asset can be bank or sme
func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

func createDocument(annualRevenue float64,
	creditHistory []string,
	creditUtilization float64,
	debtToEquityRatio float64,
	defaultHistory string,
	industryRisk float64,
	liquidity float64,
	location string,
	marketConditions float64,
	netProfitMargin float64,
	paymentHistory float64,
	profitability float64,
	recentCreditInquiries float64,
	solvency float64,
	typesOfCreditUsed string,
	yearsInBusiness float64,
	creditScoreCalibration float64) *Document {

	return &Document{
		AnnualRevenue:          annualRevenue,
		CreditHistory:          creditHistory,
		CreditUtilization:      creditUtilization,
		DebtToEquityRatio:      debtToEquityRatio,
		DefaultHistory:         defaultHistory,
		IndustryRisk:           industryRisk,
		Liquidity:              liquidity,
		Location:               location,
		MarketConditions:       marketConditions,
		NetProfitMargin:        netProfitMargin,
		PaymentHistory:         paymentHistory,
		Profitability:          profitability,
		RecentCreditInquiries:  recentCreditInquiries,
		Solvency:               solvency,
		TypesOfCreditUsed:      typesOfCreditUsed,
		YearsInBusiness:        yearsInBusiness,
		CreditScoreCalibration: creditScoreCalibration,
	}
}

func (s *SmartContract) SaveDocument(ctx contractapi.TransactionContextInterface, gstinNo string, annualRevenue float64,
	creditHistory []string,
	creditUtilization float64,
	debtToEquityRatio float64,
	defaultHistory string,
	industryRisk float64,
	liquidity float64,
	location string,
	marketConditions float64,
	netProfitMargin float64,
	paymentHistory float64,
	profitability float64,
	recentCreditInquiries float64,
	solvency float64,
	typesOfCreditUsed string,
	yearsInBusiness float64,
	creditScoreCalibration float64) error {

	doc := createDocument(annualRevenue, creditHistory, creditUtilization, debtToEquityRatio, defaultHistory, industryRisk, liquidity, location,
		marketConditions, netProfitMargin, paymentHistory, profitability, recentCreditInquiries, solvency, typesOfCreditUsed, yearsInBusiness, creditScoreCalibration)
	// loan := s.NewLoan(id, itype, liability, amount, duration, 3.0)
	sme, err := s.ReadSME(ctx, gstinNo)
	if err != nil {
		return errors.New("SME doesn't exist")
	}

	sme.Docs = *doc
	// idx := loanExists(sme.Loans, gstinNo)

	// if idx == -1 {
	// 	return errors.New("loan does not exist")
	// }
	data, err := ctx.GetStub().GetTransient()
	if err != nil {
		return err
	}

	fmt.Println(data)
	// var docJson Document

	// err = json.Unmarshal(data["GstinNo"], &docJson)
	// if err != nil {
	// 	return err
	// }
	// sme.Docs = docJson
	cred := Validate(*doc)
	sme.CreditScore = cred
	smeData, err := json.Marshal(sme)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(sme.GstinNo, smeData)
}

func Validate(data Document) float64 {

	creditScore := ((data.PaymentHistory) * 0.2) + (data.CreditUtilization * 0.2) + (float64(len(data.CreditHistory)) * 0.1) + (data.RecentCreditInquiries * 0.1) + (data.Liquidity * 0.1) + (data.Profitability * 0.1) + (data.Solvency * 0.05) + (data.IndustryRisk * 0.02) + (data.MarketConditions * 0.02)

	return creditScore

}

// AssetExists returns true when asset with given ID exists in world state
// func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
// 	assetJSON, err := ctx.GetStub().GetState(id)
// 	if err != nil {
// 		return false, fmt.Errorf("failed to read from world state: %v", err)
// 	}

// 	return assetJSON != nil, nil
// }

// // Asset describes basic details of what makes up a simple asset
// // Insert struct field in alphabetic order => to achieve determinism across languages
// // golang keeps the order when marshal to json but doesn't order automatically
// type Asset struct {
// 	AppraisedValue int    `json:"AppraisedValue"`
// 	Color          string `json:"Color"`
// 	ID             string `json:"ID"`
// 	Owner          string `json:"Owner"`
// 	Size           int    `json:"Size"`
// }

// // InitLedger adds a base set of assets to the ledger
// func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
// 	assets := []Asset{
// 		{ID: "asset1", Color: "blue", Size: 5, Owner: "Tomoko", AppraisedValue: 300},
// 		{ID: "asset2", Color: "red", Size: 5, Owner: "Brad", AppraisedValue: 400},
// 		{ID: "asset3", Color: "green", Size: 10, Owner: "Jin Soo", AppraisedValue: 500},
// 		{ID: "asset4", Color: "yellow", Size: 10, Owner: "Max", AppraisedValue: 600},
// 		{ID: "asset5", Color: "black", Size: 15, Owner: "Adriana", AppraisedValue: 700},
// 		{ID: "asset6", Color: "white", Size: 15, Owner: "Michel", AppraisedValue: 800},
// 	}

// 	for _, asset := range assets {
// 		assetJSON, err := json.Marshal(asset)
// 		if err != nil {
// 			return err
// 		}

// 		err = ctx.GetStub().PutState(asset.ID, assetJSON)
// 		if err != nil {
// 			return fmt.Errorf("failed to put to world state. %v", err)
// 		}
// 	}

// 	return nil
// }

// // CreateAsset issues a new asset to the world state with given details.
// func (s *SmartContract) CreateAsset(ctx contractapi.TransactionContextInterface, id string, color string, size int, owner string, appraisedValue int) error {
// 	exists, err := s.AssetExists(ctx, id)
// 	if err != nil {
// 		return err
// 	}
// 	if exists {
// 		return fmt.Errorf("the asset %s already exists", id)
// 	}

// 	asset := Asset{
// 		ID:             id,
// 		Color:          color,
// 		Size:           size,
// 		Owner:          owner,
// 		AppraisedValue: appraisedValue,
// 	}
// 	assetJSON, err := json.Marshal(asset)
// 	if err != nil {
// 		return err
// 	}

// 	return ctx.GetStub().PutState(id, assetJSON)
// }

// // ReadAsset returns the asset stored in the world state with given id.
// func (s *SmartContract) ReadAsset(ctx contractapi.TransactionContextInterface, id string) (*Asset, error) {
// 	assetJSON, err := ctx.GetStub().GetState(id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to read from world state: %v", err)
// 	}
// 	if assetJSON == nil {
// 		return nil, fmt.Errorf("the asset %s does not exist", id)
// 	}

// 	var asset Asset
// 	err = json.Unmarshal(assetJSON, &asset)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &asset, nil
// }

// // UpdateAsset updates an existing asset in the world state with provided parameters.
// func (s *SmartContract) UpdateAsset(ctx contractapi.TransactionContextInterface, id string, color string, size int, owner string, appraisedValue int) error {
// 	exists, err := s.AssetExists(ctx, id)
// 	if err != nil {
// 		return err
// 	}
// 	if !exists {
// 		return fmt.Errorf("the asset %s does not exist", id)
// 	}

// 	// overwriting original asset with new asset
// 	asset := Asset{
// 		ID:             id,
// 		Color:          color,
// 		Size:           size,
// 		Owner:          owner,
// 		AppraisedValue: appraisedValue,
// 	}
// 	assetJSON, err := json.Marshal(asset)
// 	if err != nil {
// 		return err
// 	}

// 	return ctx.GetStub().PutState(id, assetJSON)
// }

// // DeleteAsset deletes an given asset from the world state.
// func (s *SmartContract) DeleteAsset(ctx contractapi.TransactionContextInterface, id string) error {
// 	exists, err := s.AssetExists(ctx, id)
// 	if err != nil {
// 		return err
// 	}
// 	if !exists {
// 		return fmt.Errorf("the asset %s does not exist", id)
// 	}

// 	return ctx.GetStub().DelState(id)
// }

// // AssetExists returns true when asset with given ID exists in world state
// // func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
// // 	assetJSON, err := ctx.GetStub().GetState(id)
// // 	if err != nil {
// // 		return false, fmt.Errorf("failed to read from world state: %v", err)
// // 	}

// // 	return assetJSON != nil, nil
// // }

// // TransferAsset updates the owner field of asset with given id in world state, and returns the old owner.
// func (s *SmartContract) TransferAsset(ctx contractapi.TransactionContextInterface, id string, newOwner string) (string, error) {
// 	asset, err := s.ReadAsset(ctx, id)
// 	if err != nil {
// 		return "", err
// 	}

// 	oldOwner := asset.Owner
// 	asset.Owner = newOwner

// 	assetJSON, err := json.Marshal(asset)
// 	if err != nil {
// 		return "", err
// 	}

// 	err = ctx.GetStub().PutState(id, assetJSON)
// 	if err != nil {
// 		return "", err
// 	}

// 	return oldOwner, nil
// }

// // GetAllAssets returns all assets found in world state
// func (s *SmartContract) GetAllAssets(ctx contractapi.TransactionContextInterface) ([]*Asset, error) {
// 	// range query with empty string for startKey and endKey does an
// 	// open-ended query of all assets in the chaincode namespace.
// 	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer resultsIterator.Close()

// 	var assets []*Asset
// 	for resultsIterator.HasNext() {
// 		queryResponse, err := resultsIterator.Next()
// 		if err != nil {
// 			return nil, err
// 		}

// 		var asset Asset
// 		err = json.Unmarshal(queryResponse.Value, &asset)
// 		if err != nil {
// 			return nil, err
// 		}
// 		assets = append(assets, &asset)
// 	}

// 	return assets, nil
// }
